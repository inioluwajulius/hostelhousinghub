import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, Plus, Calendar } from "lucide-react";
import { availabilityAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface AvailabilityManagerProps {
  propertyId: string;
}

export default function AvailabilityManager({ propertyId }: AvailabilityManagerProps) {
  const { toast } = useToast();
  
  const [rooms, setRooms] = useState<any[]>([]);
  const [blockedDates, setBlockedDates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [newBlockStartDate, setNewBlockStartDate] = useState("");
  const [newBlockEndDate, setNewBlockEndDate] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [blockingDates, setBlockingDates] = useState(false);

  useEffect(() => {
    loadData();
  }, [propertyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [roomsData, blockedData] = await Promise.all([
        availabilityAPI.getPropertyAvailability(propertyId),
        availabilityAPI.getBlockedDates(propertyId),
      ]);
      setRooms(roomsData);
      setBlockedDates(blockedData);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load availability data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRoomAvailability = async (roomId: string, newCount: number) => {
    try {
      await availabilityAPI.setPropertyAvailability(propertyId, roomId, newCount);
      setRooms(
        rooms.map((r) =>
          r.id === roomId ? { ...r, available_count: newCount } : r
        )
      );
      toast({
        title: "Success",
        description: "Room availability updated",
      });
      setEditingRoom(null);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update availability",
        variant: "destructive",
      });
    }
  };

  const handleBlockDates = async () => {
    if (!newBlockStartDate || !newBlockEndDate) {
      toast({
        title: "Error",
        description: "Please select both start and end dates",
        variant: "destructive",
      });
      return;
    }

    if (newBlockStartDate > newBlockEndDate) {
      toast({
        title: "Error",
        description: "Start date must be before end date",
        variant: "destructive",
      });
      return;
    }

    setBlockingDates(true);
    try {
      const data = await availabilityAPI.blockDates(
        propertyId,
        newBlockStartDate,
        newBlockEndDate,
        blockReason || "Blocked by host"
      );

      setBlockedDates([...blockedDates, data]);
      setNewBlockStartDate("");
      setNewBlockEndDate("");
      setBlockReason("");

      toast({
        title: "Success",
        description: "Dates blocked successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to block dates",
        variant: "destructive",
      });
    } finally {
      setBlockingDates(false);
    }
  };

  const handleUnblockDates = async (blockedDateId: string) => {
    try {
      await availabilityAPI.unblockDates(blockedDateId);
      setBlockedDates(blockedDates.filter((b) => b.id !== blockedDateId));
      toast({
        title: "Success",
        description: "Dates unblocked",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to unblock dates",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading availability data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Room Availability */}
      <Card>
        <CardHeader>
          <CardTitle>Room Availability</CardTitle>
          <CardDescription>Manage how many rooms are available for booking</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rooms.length === 0 ? (
            <p className="text-center text-muted-foreground">No rooms found</p>
          ) : (
            <div className="space-y-3">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-semibold">{room.room_type}</p>
                    <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                      {room.price_per_session && (
                        <span>₦{room.price_per_session.toLocaleString()}/session</span>
                      )}
                      {room.price_per_month && (
                        <span>₦{room.price_per_month.toLocaleString()}/month</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {editingRoom?.id === room.id ? (
                      <>
                        <Input
                          type="number"
                          min="0"
                          value={editingRoom.available_count}
                          onChange={(e) =>
                            setEditingRoom({
                              ...editingRoom,
                              available_count: parseInt(e.target.value),
                            })
                          }
                          className="w-20"
                        />
                        <Button
                          size="sm"
                          onClick={() =>
                            handleUpdateRoomAvailability(
                              room.id,
                              editingRoom.available_count
                            )
                          }
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingRoom(null)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Badge className="text-base px-3 py-1">
                          {room.available_count} available
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingRoom(room)}
                        >
                          Edit
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Block Dates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Block Dates
          </CardTitle>
          <CardDescription>Block dates when the property is unavailable</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={newBlockStartDate}
                onChange={(e) => setNewBlockStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={newBlockEndDate}
                onChange={(e) => setNewBlockEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Maintenance, Personal use, etc."
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              className="mt-1"
            />
          </div>

          <Button
            onClick={handleBlockDates}
            disabled={blockingDates || !newBlockStartDate || !newBlockEndDate}
            className="w-full gap-2"
          >
            <Plus className="h-4 w-4" />
            {blockingDates ? "Blocking..." : "Block Dates"}
          </Button>
        </CardContent>
      </Card>

      {/* Blocked Dates List */}
      {blockedDates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Blocked Periods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {blockedDates.map((block) => (
                <div
                  key={block.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-semibold">
                      {new Date(block.start_date).toLocaleDateString()} →{" "}
                      {new Date(block.end_date).toLocaleDateString()}
                    </p>
                    {block.reason && (
                      <p className="text-sm text-muted-foreground mt-1">{block.reason}</p>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleUnblockDates(block.id)}
                    className="gap-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {blockedDates.length === 0 && (
        <Alert>
          <AlertDescription>No blocked periods yet. All dates are currently available.</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
